---
author: "Sarthak Makhija"
title: "Refactoring in the age of AI"
pubDate: 2026-01-31
tags: ["Refactoring", "AI", "Clean Code"]
heroImage: "/refactoring-in-the-age-of-ai.webp"
caption: "Image by Gemini"
---

### Introduction

In the era of Generative AI, we often obsess over velocity, how fast can Copilot write this function? How quickly can Antigravity build this app? But speed is just the baseline; the true “magic” of AI lies in its ability to elevate software quality to levels that were previously painstaking to achieve. AI isn't a replacement for engineering craftsmanship; it is an amplifier. To use this effectively, you still need to be the driver, the navigator, and above all, the architect who recognizes code smells. You need to identify __Primitive Obsession__ before you can ask an agent to fix it; you need to spot a __Long Method__ before you can guide an LLM to extract it.

In this article, we’ll revisit a classic refactoring example, not to merely clean it up, but to demonstrate how deep knowledge of refactoring principles combined with AI agents can deliver next-level software quality. We will start where every safe refactoring journey begins: with [characterization tests](/en/blog/lets_define_legacy_code/#which-tests-to-write).

### The Example

Let's look at a familiar piece of code (adapted from Martin Fowler's Refactoring book). It calculates rental charges for a video store.

The code below belongs to a hypothetical "Movie Rental" application that allows customers to rent either Regular or Children’s movies for a specified number of days. The application also generates a statement, which the business calls a "Text Statement." This system has been running in production for a long time without issues and has grown quite popular. Now, the business wants to generate an "HTML statement" to improve the customer experience, but crucially, they want to do this without altering the underlying logic for amount computation.

```java
import java.util.ArrayList;
import java.util.List;

public class Customer {
    private String name;
    private List<Rental> rentals = new ArrayList<>();

    public Customer(String name) {
        this.name = name;
    }
    public void addRental(Rental arg) {
        rentals.add(arg);
    }
    public String getName() {
        return name;
    }
    public String statement() {
        double totalAmount = 0;
        String result = "Rental Record for " + getName() + "\n";
        for (Rental each : rentals) {
            double thisAmount = 0;

            //determine the amounts for each line
            switch (each.getMovie().getPriceCode()) {
                case Movie.REGULAR:
                    thisAmount += 2;
                    if (each.getDaysRented() < 2)
                        thisAmount += (each.getDaysRented() - 2) * 1.5;
                    break;
                case Movie.CHILDRENS:
                    thisAmount += 1.5;
                    if (each.getDaysRented() < 3)
                        thisAmount += (each.getDaysRented() - 3) * 1.5;
                    break;
            }
            //show figures for this Rental
            result += "\t" + each.getMovie().getTitle() + "\t" +
                    String.valueOf(thisAmount) + "\n";
            totalAmount += thisAmount;
        }
        //add footer lines result
        result += "Amount owed is " + String.valueOf(totalAmount) + "\n";
        return result;
    }
}

class Movie {
    public static final int CHILDRENS = 2;
    public static final int REGULAR = 0;

    private String title;
    private int priceCode;

    public Movie(String title, int priceCode) {
        this.title = title;
        this.priceCode = priceCode;
    }

    public String getTitle() {
        return title;
    }

    public int getPriceCode() {
        return priceCode;
    }
}

class Rental {
    private int daysRented;
    private Movie movie;

    public Rental(Movie movie, int daysRented){
        this.movie = movie;
        this.daysRented = daysRented;
    }

    public int getDaysRented() {
        return daysRented;
    }

    public Movie getMovie() {
        return movie;
    }
}
```

### Characterization Tests

Before we even touch a single line of production code, we must ensure we have a safety net. This safety net comes in the form of **Characterization Tests**.

> A Characterization Test is a test that characterizes the actual behavior of a piece of code. It doesn't check for "correct" behavior but rather records what the code *currently does*.

Why do we need this? Because refactoring, by definition, means changing the structure of code without changing its behavior. If we don't know exactly what the code does right now (bugs and all), we can't guarantee we haven't broken it.

For our `Customer` class, we want to capture the exact output of the `statement()` method for various scenarios. We can ask our AI agent to generate these tests for us.

**Prompt to AI:**
Write Characterization Tests for the `statement()` method covering all branches.

**Generated Test:**
```java
@Test
public void characterizationTest() {
    Customer customer = new Customer("John Doe");

    // Regular Movie Branches
    // Line 27: if (days < 2)
    customer.addRental(new Rental(new Movie("Regular 1 Day", Movie.REGULAR), 1)); // Branch: Regular < 2
    customer.addRental(new Rental(new Movie("Regular 2 Days", Movie.REGULAR), 2)); // Branch: Regular == 2
                                                                                    // (Boundary)
    customer.addRental(new Rental(new Movie("Regular 3 Days", Movie.REGULAR), 3)); // Branch: Regular > 2

    // Children's Movie Branches
    // Line 32: if (days < 3)
    customer.addRental(new Rental(new Movie("Children 1 Day", Movie.CHILDRENS), 1)); // Branch: Childrens < 3
    customer.addRental(new Rental(new Movie("Children 3 Days", Movie.CHILDRENS), 3)); // Branch: Childrens == 3
                                                                                        // (Boundary)
    customer.addRental(new Rental(new Movie("Children 4 Days", Movie.CHILDRENS), 4)); // Branch: Childrens > 3

    // Unknown Movie Type Branch (Default case, implicitly does nothing)
    customer.addRental(new Rental(new Movie("Unknown Type", 1), 1));

    // Execute statement
    String result = customer.statement();

    String expected = "Rental Record for John Doe\n" +
            "\tRegular 1 Day\t0.5\n" +
            "\tRegular 2 Days\t2.0\n" +
            "\tRegular 3 Days\t2.0\n" +
            "\tChildren 1 Day\t-1.5\n" +
            "\tChildren 3 Days\t1.5\n" +
            "\tChildren 4 Days\t1.5\n" +
            "\tUnknown Type\t0.0\n" +
            "Amount owed is 6.0\n";

    assertEquals(expected, result);
}
```

That did not go well. The AI generated a single test with all branches, however, we want to test each branch separately. Let's ask the AI to generate tests for each branch separately.

**Prompt to AI:**
I need separate unit tests for statement method. A test with MovieType = Regular, daysRented < 2, another test with MovieType = Regular, daysRented >= 2. Similarly, write tests for Childrens Movie.

**Generated Tests:**

```java
@Test
public void statementForRegularMovieRentedForLessThanTwoDays() {
    Customer customer = new Customer("John Doe");
    customer.addRental(new Rental(new Movie("Regular 1 Day", Movie.REGULAR), 1));

    String result = customer.statement();

    String expected = "Rental Record for John Doe\n" +
            "\tRegular 1 Day\t0.5\n" +
            "Amount owed is 0.5\n";

    assertEquals(expected, result);
}

@Test
public void statementForRegularMovieRentedForTwoOrMoreDays() {
    Customer customer = new Customer("John Doe");
    customer.addRental(new Rental(new Movie("Regular 3 Days", Movie.REGULAR), 3));

    String result = customer.statement();

    String expected = "Rental Record for John Doe\n" +
            "\tRegular 3 Days\t2.0\n" +
            "Amount owed is 2.0\n";

    assertEquals(expected, result);
}

@Test
public void statementForChildrensMovieRentedForLessThanThreeDays() {
    Customer customer = new Customer("John Doe");
    customer.addRental(new Rental(new Movie("Children 1 Day", Movie.CHILDRENS), 1));

    String result = customer.statement();

    String expected = "Rental Record for John Doe\n" +
            "\tChildren 1 Day\t-1.5\n" +
            "Amount owed is -1.5\n";

    assertEquals(expected, result);
}

@Test
public void statementForChildrensMovieRentedForThreeOrMoreDays() {
    Customer customer = new Customer("John Doe");
    customer.addRental(new Rental(new Movie("Children 4 Days", Movie.CHILDRENS), 4));

    String result = customer.statement();

    String expected = "Rental Record for John Doe\n" +
            "\tChildren 4 Days\t1.5\n" +
            "Amount owed is 1.5\n";

    assertEquals(expected, result);
}
```

This is much better. However, I want to add one more characterization test covering multiple rentals for a customer. This gives me confidence that the system correctly handles multiple entries, allowing me to refactor without worry. It is a judgment call to ensure I have a wide enough safety net.

**Prompt to AI:**
Add another characterization test with rentals for childres and regular movie types.

**Generated Test:**

```java
@Test
public void statementForRegularAndChildrensMovies() {
    Customer customer = new Customer("John Doe");
    customer.addRental(new Rental(new Movie("Regular 1 Day", Movie.REGULAR), 1));
    customer.addRental(new Rental(new Movie("Children 4 Days", Movie.CHILDRENS), 4));

    String result = customer.statement();

    String expected = "Rental Record for John Doe\n" +
            "\tRegular 1 Day\t0.5\n" +
            "\tChildren 4 Days\t1.5\n" +
            "Amount owed is 2.0\n";

    assertEquals(expected, result);
}
```

Given all the tests are passing, we will make a _git commit_, push the changes and move on to refactoring the code.

### Extract Method (Amount)

We are ready to begin. The `statement()` method is our first target. While it may not look excessively long in lines of code, it suffers from the **Long Method** smell because it is highly decomposable, and until we break it apart, other smells will remain hidden in the noise.

Since this is our first refactoring move, I want to be explicit. I'll provide the AI with precise, step-by-step instructions to minimize ambiguity. As we build momentum and trust, I’ll experiment with leaner prompts.

**Prompt to AI:**
Let's refactor the `statement()` method. It is a long method, and I would like to extract the rental calculation for each ` movieType` in a separate method. The method will be called `amount` and it will just accept `Rental` (/`each`). This method will return a `double` which will be assigned to `thisAmount`.

**Generated Code:**

```java
public String statement() {
    double totalAmount = 0;
    String result = "Rental Record for " + getName() + "\n";
    for (Rental each : rentals) {
        double thisAmount = amount(each);

        // show figures for this Rental
        result += "\t" + each.getMovie().getTitle() + "\t" +
                String.valueOf(thisAmount) + "\n";
        totalAmount += thisAmount;
    }
    // add footer lines result
    result += "Amount owed is " + String.valueOf(totalAmount) + "\n";
    return result;
}

private double amount(Rental each) {
    double thisAmount = 0;
    switch (each.getMovie().getPriceCode()) {
        case Movie.REGULAR:
            thisAmount += 2;
            if (each.getDaysRented() < 2)
                thisAmount += (each.getDaysRented() - 2) * 1.5;
            break;
        case Movie.CHILDRENS:
            thisAmount += 1.5;
            if (each.getDaysRented() < 3)
                thisAmount += (each.getDaysRented() - 3) * 1.5;
            break;
    }
    return thisAmount;
}
```

Excellent! We can run all the tests and create a _git commit_. Now is the perfect time for some quick refactorings, such as renaming `each` to `rental` and `thisAmount` to `amount`. Here is the code resulting from these quick wins:

```java
public String statement() {
    double totalAmount = 0;
    String result = "Rental Record for " + getName() + "\n";
    for (Rental rental : rentals) {
        double rentalAmount = amount(rental);

        // show figures for this Rental
        result += "\t" + rental.getMovie().getTitle() + "\t" +
                String.valueOf(rentalAmount) + "\n";
        totalAmount += rentalAmount;
    }
    // add footer lines result
    result += "Amount owed is " + String.valueOf(totalAmount) + "\n";
    return result;
}

private double amount(Rental rental) {
    double amount = 0;
    switch (rental.getMovie().getPriceCode()) {
        case Movie.REGULAR:
            amount += 2;
            if (rental.getDaysRented() < 2)
                amount += (rental.getDaysRented() - 2) * 1.5;
            break;
        case Movie.CHILDRENS:
            amount += 1.5;
            if (rental.getDaysRented() < 3)
                amount += (rental.getDaysRented() - 3) * 1.5;
            break;
    }
    return amount;
}
```

We can run all the tests and record our progress with a _git commit_.

### Move Method

A close examination of the `amount()` method reveals that it relies solely on the `Rental` object. This suggests the method is a better fit for the `Rental` class. Before we move it, we can add the `static` keyword to confirm that the method does not use any properties of the `Customer` class.

Run all the tests after adding `static` keyword, they pass. It confirms we have **Feature Envy** and we can move the `amount()` method to the `Rental` class (remove the `static` qualifier before moving).

**Prompt to AI:**
Move the `amount()` method to the `Rental` class. 

**Generated Code:**

```java
public class Customer {
    public String statement() {
        double totalAmount = 0;
        String result = "Rental Record for " + getName() + "\n";
        for (Rental rental : rentals) {
            double rentalAmount = rental.getAmount();

            // show figures for this Rental
            result += "\t" + rental.getMovie().getTitle() + "\t" +
                    String.valueOf(rentalAmount) + "\n";
            totalAmount += rentalAmount;
        }
        // add footer lines result
        result += "Amount owed is " + String.valueOf(totalAmount) + "\n";
        return result;
    }
}

class Rental {
    public double getAmount() {
        double amount = 0;
        switch (getMovie().getPriceCode()) {
            case Movie.REGULAR:
                amount += 2;
                if (getDaysRented() < 2)
                    amount += (getDaysRented() - 2) * 1.5;
                break;
            case Movie.CHILDRENS:
                amount += 1.5;
                if (getDaysRented() < 3)
                    amount += (getDaysRented() - 3) * 1.5;
                break;
        }
    }
}
```
        
Good job! I'll start by renaming `getAmount` to `amount`. Since all our tests are passing, I'll perform one more refactoring step before committing. The `amount` method currently depends on both the `priceCode` from the `Movie` class and `daysRented` from the `Rental` class. Since the amount calculation logic is primarily driven by the `priceCode`, it makes sense to move this method to the `Movie` class and pass `daysRented` as an argument. This move also encapsulates the `priceCode` switch case within the `Movie` class, preventing it from leaking _switch_ logic into other classes.

**Prompt to AI:**
Move the `amount()` method to the `Movie` class passing `daysRented` as argument. 

**Generated Code:**

```java
class Rental {
    public double amount() {
        return movie.amount(daysRented);
    }
}

class Movie {
    public double amount(int daysRented) {
        double amount = 0;
        switch (priceCode) {
            case REGULAR:
                amount += 2;
                if (daysRented < 2)
                    amount += (daysRented - 2) * 1.5;
                break;
            case CHILDRENS:
                amount += 1.5;
                if (daysRented < 3)
                    amount += (daysRented - 3) * 1.5;
                break;
        }
        return amount;
    }
}
```

Nice, and all our tests are running. This refactoring also gives us an opportunity to add unit tests for `Movie` and `Rental`. Let's ask AI to add unit tests for both these objects.

**Prompt to AI:**
Add unit tests for Movie, cover all branches. Ensure separate test cases.

**Generated Tests:**

```java
public class MovieTest {

    @Test
    public void amountForRegularMovieRentedForLessThanTwoDays() {
        Movie movie = new Movie("Regular", Movie.REGULAR);
        double amount = movie.amount(1);
        assertEquals(0.5, amount);
    }

    @Test
    public void amountForRegularMovieRentedForTwoDaysOrMore() {
        Movie movie = new Movie("Regular", Movie.REGULAR);
        double amount = movie.amount(3);
        assertEquals(2.0, amount);
    }

    @Test
    public void amountForChildrensMovieRentedForLessThanThreeDays() {
        Movie movie = new Movie("Children", Movie.CHILDRENS);
        double amount = movie.amount(2);
        assertEquals(0.0, amount);
    }

    @Test
    public void amountForChildrensMovieRentedForThreeDaysOrMore() {
        Movie movie = new Movie("Children", Movie.CHILDRENS);
        double amount = movie.amount(4);
        assertEquals(1.5, amount);
    }
}
```

Excellent. We could apply the same process for `Rental`. However, `Rental`'s `amount()` method is now just a wrapper that delegates to `Movie`, making the need for separate tests debatable. We have made decent progress; `Rental` and `Movie` are no longer just data classes, they now encapsulate behavior alongside their data. All are tests are passing, let's record this refactoring as a _git commit_.

### Replace Temp with Query

This is how our code looks like:

```java
class Customer {
    public String statement() {
        double totalAmount = 0;
        String result = "Rental Record for " + getName() + "\n";
        for (Rental rental : rentals) {
            double rentalAmount = rental.amount();

            // show figures for this Rental
            result += "\t" + rental.getMovie().getTitle() + "\t" +
                    String.valueOf(rentalAmount) + "\n";
            totalAmount += rentalAmount;
        }
        // add footer lines result
        result += "Amount owed is " + String.valueOf(totalAmount) + "\n";
        return result;
    }
}

class Movie {
    public double amount(int daysRented) {
        double amount = 0;
        switch (priceCode) {
            case REGULAR:
                amount += 2;
                if (daysRented < 2)
                    amount += (daysRented - 2) * 1.5;
                break;
            case CHILDRENS:
                amount += 1.5;
                if (daysRented < 3)
                    amount += (daysRented - 3) * 1.5;
                break;
        }
        return amount;
    }
}

class Rental {
    public double amount() {
        return movie.amount(daysRented);
    }
}
```

What’s the next move? The `switch` statement in `Movie.amount()` may look like a candidate for polymorphism, but I want to ensure we've truly achieved our primary goal: decomposing the `statement()` method before moving on to other refactoring.

I would argue the method is still 'long' - not in terms of line count, but in terms of responsibility. I can clearly distinguish three separate phases within it: generating the header, processing the body, and assembling the footer.

Before we move forward with the refactoring of `statement` methods, let's have a conversation with AI and see if it has any suggestions for us.

**Prompt to AI:**
Provide me potential candidates for next refactoring. Do not change anything.

**Generated Response:**
1. Move Classes to Separate Files
2. __Replace Conditional with Polymorphism__ (in `Movie`) 
3. __Replace Temp with Query__ (in `statement()`)
    - Context: The `statement` method calculates `totalAmount` while generating the string.
    - Value: Extracting the calculation into a method (e.g., `getTotalCharge`) separates the business logic from the presentation logic, making it easier to support other formats like HTML statements.

Suggestion 3 is appealing, even impressive, the AI suggested supporting HTML statements without any prompting from me. However, this is exactly where we must exercise discipline. Adhering to the **YAGNI** ('You Aren't Gonna Need It') principle, we must not refactor based on speculation. No matter how clever the AI's prediction is, if the requirement doesn't exist today, we shouldn't build the complexity to support it. 

However, AI is right in pointing out that we can refactor the `statement` method to separate the business logic from the presentation logic by applying the __Replace Temp with Query__ refactoring. Let's try asking the AI to provide us with a refactored version of the `statement` method.

**Prompt to AI:**
Implement Replace Temp with Query (in Customer.statement)

**Generated Code:**

```java
public String statement() {
    String result = "Rental Record for " + getName() + "\n";
    for (Rental rental : rentals) {
        double rentalAmount = rental.amount();

        // show figures for this Rental
        result += "\t" + rental.getMovie().getTitle() + "\t" +
                String.valueOf(rentalAmount) + "\n";
    }
    // add footer lines result
    result += "Amount owed is " + String.valueOf(getTotalCharge()) + "\n";
    return result;
}

private double getTotalCharge() {
    double result = 0;
    for (Rental rental : rentals) {
        result += rental.amount();
    }
    return result;
}
```

This looks much cleaner, and our tests are green. Let's commit this and rename `getTotalCharge` to `totalCharge`. The `statement` method now clearly reveals its structure: header, body, and footer.

> You might notice we are now iterating over `rentals` twice. While some might worry about performance, it’s crucial not to optimize prematurely. Our priorities are correctness first, clarity second, and performance third. If profiling later shows `statement()` is a bottleneck, we can optimize it then, but for now, readability wins.

If you have a keen eye for code smells, you might notice that `totalCharge` depends exclusively on the `rentals` collection. To verify this, let's pass `rentals` as a parameter and make the method `static`. If our tests pass, it confirms that `totalCharge` is a pure function of its input. This reveals a classic case of **Feature Envy**: the method is more interested in the `rentals` data than the `Customer` class it resides in, suggesting it belongs in a dedicated `Rentals` class.

Additionally, there's another subtle smell here: **Primitive Obsession** regarding `List<Rental>`. While a `List` isn't a primitive type in Java, using a generic collection to represent a domain concept (a collection of customer rentals) is the same mistake. It's just a raw container. By upgrading this to a first-class `Rentals` object, we create a proper home for behavior like `totalCharge` that belongs to the collection, not the client (`Customer`) using it.

```java
//this method depends only on rentals collection.
private double totalCharge(List<Rental> rentals) {
    double result = 0;
    for (Rental rental : rentals) {
        result += rental.amount();
    }
    return result;
}
```

### Encapsulate Collection

It's time to introduce a first-class collection. We'll create a `Rentals` class to manage the list of rentals. To maintain backward compatibility and minimize initial breakage, `Rentals` will extend `ArrayList<Rental>` for now.

Let's ask AI to introduce `Rentals`.

**Prompt to AI:**
Introduce `Rentals` class. Extend it from ArrayList<Rental>, and move `totalCharge` to `Rentals`.

**Generated Code:**

```java
public class Customer {
    private String name;
    private Rentals rentals = new Rentals();

    public String statement() {
        String result = "Rental Record for " + getName() + "\n";
        for (Rental rental : rentals) {
            double rentalAmount = rental.amount();

            // show figures for this Rental
            result += "\t" + rental.getMovie().getTitle() + "\t" +
                    rentalAmount + "\n";
        }
        // add footer lines result
        result += "Amount owed is " + rentals.totalCharge() + "\n";
        return result;
    }
}

class Rentals extends ArrayList<Rental> {
    public double totalCharge() {
        double result = 0;
        for (Rental rental : this) {
            result += rental.amount();
        }
        return result;
    }
}
```

It looks good, and all the tests are running. We can now as AI to add tests for `Rentals` covering all scenarios: no rental, a single rental and multiple rentals.

**Prompt to AI:**
Write unit tests for `Rentals`, cover all scenarios: no rental, a single rental and multiple rentals. Ensure separate unit tests for all scenarios.

**Generated Tests:**

```java
public class RentalsTest {

    @Test
    public void totalChargeForNoRentals() {
        Rentals rentals = new Rentals();
        assertEquals(0.0, rentals.totalCharge());
    }

    @Test
    public void totalChargeForSingleRental() {
        Rentals rentals = new Rentals();
        rentals.add(new Rental(new Movie("Regular", Movie.REGULAR), 1));
        assertEquals(0.5, rentals.totalCharge());
    }

    @Test
    public void totalChargeForMultipleRentals() {
        Rentals rentals = new Rentals();
        rentals.add(new Rental(new Movie("Regular", Movie.REGULAR), 1));
        rentals.add(new Rental(new Movie("Children", Movie.CHILDRENS), 4));
        assertEquals(2.0, rentals.totalCharge());
    }
}
```

The tests looks good, and all the tests are running. Let's create a _git commit_.

### Extract Method (Header, Body, Footer)

This is how our `statement()` method looks like:

```java
public String statement() {
    String result = "Rental Record for " + getName() + "\n";
    for (Rental rental : rentals) {
        double rentalAmount = rental.amount();

        // show figures for this Rental
        result += "\t" + rental.getMovie().getTitle() + "\t" +
                rentalAmount + "\n";
    }
    // add footer lines result
    result += "Amount owed is " + rentals.totalCharge() + "\n";
    return result;
}
```

We can now refactor the `statement()` to be composed of `header`, `body` and `footer`. Let's ask AI to futher decompose this method.

**Prompt to AI:**
Refactor statement method to consist of header, body and footer. 

**Generated Code:**

```java
public String statement() {
    return header() + body() + footer();
}

private String header() {
    return "Rental Record for " + getName() + "\n";
}

private String body() {
    String result = "";
    for (Rental rental : rentals) {
        // show figures for this Rental
        result += "\t" + rental.getMovie().getTitle() + "\t" +
                rental.amount() + "\n";
    }
    return result;
}

private String footer() {
    return "Amount owed is " + rentals.totalCharge() + "\n";
}
```

This look good, AI also removed the comment __// add footer lines result__, which is good because the method name `footer()` already tells us that it's adding a footer line. We have made very good progress in refactoring the `statement()` method. Let's create a _git commit_ since all our tests are passing.

I can three potential refactoring opportunites:

1. Rename `statement()` to `textStatement()`, `header` to `textHeader`, `body` to `textBody` and `footer` to `textFooter`.
2. Introduce polymorphism in `Movie` to handle different price codes.
3. Refactor `body` method. It depends on properties and behaviors of `Movie` and `Rental` classes.

I think I will take point 1 first. It is a simple rename operation, and it makes the intent of `statement()` clearer.

### Extract Class (TextStatement)

Let's ask AI to rename statement to `textStatement` and its child methods `header`, `body` and `footer` to `textHeader`, `textBody` and `textFooter` respectively.

**Prompt to AI:**
Rename statement to `textStatement` and its child methods `header`, `body` and `footer` to `textHeader`, `textBody` and `textFooter` respectively.

**Generated Code:**

```java
public class Customer {

    public String textStatement() {
        return textHeader() + textBody() + textFooter();
    }

    private String textHeader() {
        return "Rental Record for " + getName() + "\n";
    }

    private String textBody() {
        String result = "";
        for (Rental rental : rentals) {
            // show figures for this Rental
            result += "\t" + rental.getMovie().getTitle() + "\t" +
                    rental.amount() + "\n";
        }
        return result;
    }

    private String textFooter() {
        return "Amount owed is " + rentals.totalCharge() + "\n";
    }
}
```

Excellent, all tests pass. Let's maximize this win with a commit. This refactoring does more than just rename; it reveals a structural pattern. We now have a cluster of methods sharing the `text` prefix, all operating on the same data. This cohesive group suggests a hidden abstraction, perhaps a **TextStatement** object, waiting to be extracted.

Let's ask AI to introduce `TextStatement`.

**Prompt to AI:**
Introduce TextStatment class which depends on customer name and rentals.

**Generated Code:**

```java
public class Customer {
    public String textStatement() {
        return new TextStatement(this.name, this.rentals).value();
    }
}

class TextStatement {
    private String customerName;
    private Rentals rentals;

    public TextStatement(String customerName, Rentals rentals) {
        this.customerName = customerName;
        this.rentals = rentals;
    }

    public String value() {
        return textHeader() + textBody() + textFooter();
    }

    private String textHeader() {
        return "Rental Record for " + customerName + "\n";
    }

    private String textBody() {
        String result = "";
        for (Rental rental : rentals) {
            // show figures for this Rental
            result += "\t" + rental.getMovie().getTitle() + "\t" +
                    rental.amount() + "\n";
        }
        return result;
    }

    private String textFooter() {
        return "Amount owed is " + rentals.totalCharge() + "\n";
    }
}
```

This is nice. I would like to rename `value` method of `TextStatement` to `get`, `textHeader`, `textBody` and `textFooter` to `header`, `body` and `footer` respectively and add unit tests for this class.

**Prompt to AI:**
Rename value to get, textHeader to header, textBody to body and textFooter to footer and add unit tests for TextStatement.

**Generated Tests:**

```java
    @Test
    public void testGetReturnStatement() {
        Rentals rentals = new Rentals();
        rentals.add(new Rental(new Movie("Regular", Movie.REGULAR), 1));
        rentals.add(new Rental(new Movie("New Release", Movie.CHILDRENS), 4));

        TextStatement statement = new TextStatement("John Doe", rentals);
        String result = statement.get();

        String expected = "Rental Record for John Doe\n" +
                "\tRegular\t0.5\n" +
                "\tNew Release\t1.5\n" +
                "Amount owed is 2.0\n";

        assertEquals(expected, result);
    }
}
```

We should definitely rename the test. Notice that `Customer.textStatement()` has become a simple delegate to `TextStatement`. This signals that the responsibility has fully shifted. It’s now appropriate to move our original characterization tests from the `Customer` class to `TextStatement`, ensuring our tests live alongside the logic they verify.

Let's ask AI to move the tests from `Customer` to `TextStatement`. And maybe we will keep one test in `Customer` which generates a text statement for multiple rentals.

**Prompt to AI:**
Move the tests from `Customer` to `TextStatement`. And maybe we will keep one test in `Customer` which generates a text statement for multiple rentals. Also ensure all the test names do not begin with test and reflect the domain Text statement.

**Generated Code:**

```java
public class CustomerTest {

    @Test
    public void textStatementForRegularAndChildrensMovies() {
        Customer customer = new Customer("John Doe");
        customer.addRental(new Rental(new Movie("Regular 1 Day", Movie.REGULAR), 1));
        customer.addRental(new Rental(new Movie("Children 4 Days", Movie.CHILDRENS), 4));

        String result = customer.textStatement();

        String expected = "Rental Record for John Doe\n" +
                "\tRegular 1 Day\t0.5\n" +
                "\tChildren 4 Days\t1.5\n" +
                "Amount owed is 2.0\n";

        assertEquals(expected, result);
    }
}

public class TextStatementTest {

    @Test
    public void regularMovieRentedForLessThanTwoDays() {
        Rentals rentals = new Rentals();
        rentals.add(new Rental(new Movie("Regular 1 Day", Movie.REGULAR), 1));

        TextStatement statement = new TextStatement("John Doe", rentals);
        String result = statement.get();

        String expected = "Rental Record for John Doe\n" +
                "\tRegular 1 Day\t0.5\n" +
                "Amount owed is 0.5\n";

        assertEquals(expected, result);
    }

    @Test
    public void regularMovieRentedForTwoOrMoreDays() {
        Rentals rentals = new Rentals();
        rentals.add(new Rental(new Movie("Regular 3 Days", Movie.REGULAR), 3));

        TextStatement statement = new TextStatement("John Doe", rentals);
        String result = statement.get();

        String expected = "Rental Record for John Doe\n" +
                "\tRegular 3 Days\t2.0\n" +
                "Amount owed is 2.0\n";

        assertEquals(expected, result);
    }

    @Test
    public void childrensMovieRentedForLessThanThreeDays() {
        Rentals rentals = new Rentals();
        rentals.add(new Rental(new Movie("Children 1 Day", Movie.CHILDRENS), 1));

        TextStatement statement = new TextStatement("John Doe", rentals);
        String result = statement.get();

        String expected = "Rental Record for John Doe\n" +
                "\tChildren 1 Day\t-1.5\n" +
                "Amount owed is -1.5\n";

        assertEquals(expected, result);
    }

    @Test
    public void childrensMovieRentedForThreeOrMoreDays() {
        Rentals rentals = new Rentals();
        rentals.add(new Rental(new Movie("Children 4 Days", Movie.CHILDRENS), 4));

        TextStatement statement = new TextStatement("John Doe", rentals);
        String result = statement.get();

        String expected = "Rental Record for John Doe\n" +
                "\tChildren 4 Days\t1.5\n" +
                "Amount owed is 1.5\n";

        assertEquals(expected, result);
    }
}
```

Great, all tests pass. Let's create a _git commit_.

### Moving Tests and Cleanup

This is how our code looks like:

```java
public class Customer {
    private String name;
    private Rentals rentals = new Rentals();

    public Customer(String name) {
        this.name = name;
    }

    public void addRental(Rental rental) {
        rentals.add(rental);
    }

    public String getName() {
        return name;
    }

    public String textStatement() {
        return new TextStatement(this.name, this.rentals).get();
    }
}

class Movie {
    public static final int CHILDRENS = 2;
    public static final int REGULAR = 0;

    private String title;
    private int priceCode;

    public Movie(String title, int priceCode) {
        this.title = title;
        this.priceCode = priceCode;
    }

    public String getTitle() {
        return title;
    }

    public int getPriceCode() {
        return priceCode;
    }

    public double amount(int daysRented) {
        double amount = 0;
        switch (priceCode) {
            case REGULAR:
                amount += 2;
                if (daysRented < 2)
                    amount += (daysRented - 2) * 1.5;
                break;
            case CHILDRENS:
                amount += 1.5;
                if (daysRented < 3)
                    amount += (daysRented - 3) * 1.5;
                break;
        }
        return amount;
    }
}

class Rental {
    private int daysRented;
    private Movie movie;

    public Rental(Movie movie, int daysRented) {
        this.movie = movie;
        this.daysRented = daysRented;
    }

    public int getDaysRented() {
        return daysRented;
    }

    public Movie getMovie() {
        return movie;
    }

    public double amount() {
        return movie.amount(daysRented);
    }
}

class Rentals extends ArrayList<Rental> {
    public double totalCharge() {
        double result = 0;
        for (Rental rental : this) {
            result += rental.amount();
        }
        return result;
    }
}

class TextStatement {
    private String customerName;
    private Rentals rentals;

    public TextStatement(String customerName, Rentals rentals) {
        this.customerName = customerName;
        this.rentals = rentals;
    }

    public String get() {
        return header() + body() + footer();
    }

    private String header() {
        return "Rental Record for " + customerName + "\n";
    }

    private String body() {
        String result = "";
        for (Rental rental : rentals) {
            // show figures for this Rental
            result += "\t" + rental.getMovie().getTitle() + "\t" +
                    rental.amount() + "\n";
        }
        return result;
    }

    private String footer() {
        return "Amount owed is " + rentals.totalCharge() + "\n";
    }
}
```

I can still three potential refactoring opportunites:

1. __Remove unnecessary getters__. We have encapsulated the code enough to ensure that the internal implementation details are not exposed, which provides us the opportunity to remove some of the getters.
2. __Introduce polymorphism__ in `Movie` to handle different price codes.
3. __Refactor__ `body` method. It depends on properties and behaviors of `Movie` and `Rental` classes.

Let's pick the first one and ask AI to remove unnecessary getters. These should be `getName` from `Customer`, `getPriceCode` from `Movie` and `getDaysRented` from `Rental`.

**Prompt to AI:**
Remove unnecessary getters from the following code.

It removed the getters which we were expecting. Let's commit this change.

For the scope of this article, I'll defer the introduction of polymorphism in the `Movie` class. However, we've achieved a significant victory by successfully encapsulating the `switch` statement within `Movie`. This means we can swap it for polymorphism in the future with zero impact on `Rental` or `Customer`.

Turning our attention to the `body` method in `TextStatement`, a few issues immediately jump out at me:

1. **Broken Encapsulation**: The chain `rental.getMovie().getTitle()` is a Law of Demeter violation. `TextStatement` knows too much about the internal structure of `Rental` and `Movie`.
2. **Misplaced Responsibility**: Since we have a `Rentals` first-class collection, shouldn't the logic for iterating and formatting the body live there instead?
3. **Hidden Domain Concept**: The comment `// show figures for this Rental` is intriguing. Is 'Figure' just a throwaway word, or does it represent a missing domain object waiting to be discovered?

Let me share my thoughts before we have a conversation with AI for these.

1. **Encapsulation**: Point 1 is easily solvable. We can follow the Law of Demeter by having `Rental` expose a `movieTitle()` method, allowing us to hide the entire `Movie` object.
2. **Responsibility**: While `Rentals` manages the collection, it shouldn't necessarily know how to *print* itself. Generating the statement format remains the responsibility of `TextStatement`.
3. **Missing Concept**: 'Figure' feels like more than just a comment. It likely represents a concrete domain type, perhaps a tuple combining the *Movie title* and *Amount* that we haven't yet introduced. 

Let's have a quick conversation with AI about these points and get its thoughts.

**Prompt to AI:**
I have the following concerns about the `body` method in `TextStatement` class:

1. It breaks encapsulation `rental.getMovie().getTitle()`. `TextStatement` knows that rental has a movie which has a title. This is not good.
2. We already have an abstraction called `Rentals`. Does this mean we can move this behavior (`body`) to `Rentals` class?
3. The comment `// show figures for this Rental` gives me a domain concept called `Figure`. Is this just a comment or does this domain term `Figure` mean something more?

Share your thoughts, do not change anything.

**AI's Response:**

<img src="/refactoring-in-the-age-of-ai-conversation.webp" />

Cool. So, we can ask AI to handle these one-by-one. Let's ask it to encapsulate `Movie` inside `Rental`.

**Prompt to AI:**
Encapsulate `Movie` inside `Rental` and expose `movieTitle()` method from `Rental`.

**Generated Code:**

```java

class Rental {
    public String movieTitle() {
        return movie.getTitle();
    }
}

class TextStatement {
    private String body() {
        String result = "";
        for (Rental rental : rentals) {
            // show figures for this Rental
            result += "\t" + rental.movieTitle() + "\t" +
                    rental.amount() + "\n";
        }
        return result;
    }
}
```

Excellent. The AI correctly identified that `getMovie()` was no longer needed and removed it. Let's lock in this improvement with a commit.

Regarding the `body` generation, I'll stick to my decision: `TextStatement` handles the formatting, not `Rentals`. However, I can't shake the feeling that `Figure` is a missing abstraction. I trust that the original developer's choice of vocabulary wasn't accidental. My plan is to have `Rentals` provide an iterator of `Figure` objects, which `TextStatement` can then consume to generate the output. I imagine `Figure` would be just a `data` class.

Before I go ahead with this, I would like to see what AI does when I ask it to introduce `Figure` and refactor the `body` method.

**Prompt to AI:**
Introduce Figure and refactor the body method.

**Generated Code:**

```java
class Rental {
    public Figure figure() {
        return new Figure(movieTitle(), amount());
    }
}

class Figure {
    private final String title;
    private final double amount;

    public Figure(String title, double amount) {
        this.title = title;
        this.amount = amount;
    }

    public String getTitle() {
        return title;
    }

    public double getAmount() {
        return amount;
    }
}

class TextStatement {
    private String body() {
        String result = "";
        for (Rental rental : rentals) {
            Figure figure = rental.figure();
            result += "\t" + figure.getTitle() + "\t" +
                    figure.getAmount() + "\n";
        }
    }
}
```
        
I generally avoid data classes, and this implementation gives me pause. `Rental` now exposes `Figure`, which simply re-exposes `title` and `amount` via getters. It feels like we're trading one encapsulation leak for another.

That said, giving `Figure` the responsibility to *print* itself seems wrong, too especially if `HtmlStatement` is in the pipeline. For now, I'll accept `Figure` as a data carrier to satisfy the current need. On a different day, I might have chosen to revert the method and keep the comment as a breadcrumb, but today, I'll stick with the explicit type.

Let's commit this change.

With this, our refactoring of `textStatement()` is complete. We’ve transformed a monolithic method into a clean, testable design. While I won’t implement `htmlStatement()` in this article, notice how standardizing on `TextStatement` paves the way for it.

The final code is available [here]().

### Summary

In the age of AI, the rules of craftsmanship still apply. Here is my manifesto for refactoring with LLMs:

*   **Lead the Way**: You don't always need a final destination, but you must have a direction. Be the driver who evaluates options and sets the course, rather than letting the AI drift aimlessly.
*   **Sharpen Your Senses**: You can't ask an agent to fix what you can't see. Your ability to recognize smells is the prerequisite for effective prompting.
*   **Stay Focused**: Build iteratively on your progress. Resist the urge to chase every shiny refactoring opportunity the AI suggests; avoid digressions and finish your current objective first.
*   **Trust but Verify**: AI is a powerful assistant, not a replacement for your judgment. Review every change.
*   **Own the Code**: At the end of the day, you are responsible for the production system, not an AI system.
*   **Speed is Given, Quality is Earned**: AI brings velocity for free. Your job is to channel that energy into raising the bar for software quality.
*   **Small Steps**: Keep your feedback loops tight. Make small, verifying commits to maintain a safety net.

### Mention

I would like to thank [Chirag Doshi](https://www.linkedin.com/in/chiragdoshi/) for reviewing the article and sparking the idea for this essay during a discussion on teaching refactoring with AI.

I used [Antigravity](https://antigravity.google/) with Gemini 3 Pro High.